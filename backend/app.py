import os
import jwt
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)

CORS(app, origins="*")

SECRET_KEY = "secret"

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def verify_token(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"message": "Token not provided"}), 401

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"message": "Invalid token format"}), 401

        token = parts[1]

        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=["HS256"]
            )
            request.username = payload["username"]
            request.user_id = payload.get("user_id")
            request.rol = payload.get("rol")

        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 403

        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token"}), 403

        return func(*args, **kwargs)

    return wrapper

@app.route("/login", methods=["POST"])
def login():
    try:
        datos = request.get_json()

        username = datos.get("username")
        password = datos.get("password")

        if not username or not password:
            return jsonify({
                "message": "Username and password are required"
            }), 400

        response = (
            supabase
            .table("empleados")
            .select("*")
            .eq("email", username)
            .limit(1)
            .execute()
        )

        if len(response.data) == 0:
            return jsonify({
                "message": "Authentication failed"
            }), 401

        empleado = response.data[0]

        if empleado["password"] != password:
            return jsonify({
                "message": "Authentication failed"
            }), 401

        token = jwt.encode(
            {
                "username": username,
                "user_id": empleado["id"],
                "rol": empleado["rol"],
                "nombre": empleado["nombre"],
                "exp": datetime.utcnow() + timedelta(hours=2)
            },
            SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "token": token,
            "usuario": {
                "id": empleado["id"],
                "nombre": empleado["nombre"],
                "apellido": empleado["apellido"],
                "email": empleado["email"],
                "rol": empleado["rol"]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "message": "Internal server error",
            "error": str(e)
        }), 500

@app.route("/registro", methods=["POST"])
def registro():
    try:
        datos = request.get_json()
        
        nombre = datos.get("nombre")
        apellido = datos.get("apellido")
        email = datos.get("email")
        password = datos.get("password")
        telefono = datos.get("telefono", "")
        puesto = datos.get("puesto", "Empleado")
        
        if not nombre or not apellido or not email or not password:
            return jsonify({
                "message": "Todos los campos son requeridos"
            }), 400
        
        response = (
            supabase
            .table("empleados")
            .select("*")
            .eq("email", email)
            .execute()
        )
        
        if len(response.data) > 0:
            return jsonify({
                "message": "El correo electrónico ya está registrado"
            }), 400
        
        response = (
            supabase
            .table("empleados")
            .insert({
                "nombre": nombre,
                "apellido": apellido,
                "email": email,
                "password": password,
                "telefono": telefono,
                "puesto": puesto,
                "rol": "usuario"
            })
            .execute()
        )
        
        return jsonify({
            "message": "Usuario registrado exitosamente",
            "usuario": response.data[0]
        }), 201
        
    except Exception as e:
        return jsonify({
            "message": "Error al registrar usuario",
            "error": str(e)
        }), 500

@app.route("/solicitudes", methods=["POST"])
@verify_token
def crear_solicitud():
    try:
        datos = request.get_json()
        user_id = request.user_id
        
        tipo = datos.get("tipo")
        fecha_inicio = datos.get("fecha_inicio")
        fecha_fin = datos.get("fecha_fin")
        descripcion = datos.get("descripcion", "")
        
        from datetime import datetime as dt
        from datetime import date
        
        hoy = date.today()
        fecha_inicio_obj = dt.strptime(fecha_inicio, "%Y-%m-%d").date()
        
        if fecha_inicio_obj < hoy:
            return jsonify({
                "message": "La fecha de inicio no puede ser en el pasado"
            }), 400

        if tipo == "vacaciones":
            limite = 2
        elif tipo == "permiso":
            limite = 3
        else:
            limite = 999
        
        response = (
            supabase
            .table("solicitudes_ausencias")
            .select("id", count="exact")
            .eq("fecha_inicio", fecha_inicio)
            .eq("tipo", tipo)
            .in_("estado", ["aprobada", "pendiente"])
            .execute()
        )
        
        cantidad_total = len(response.data) if response.data else 0
        
        if cantidad_total >= limite:
            estado = "rechazada"
            prioridad = cantidad_total + 1
            mensaje = f"No hay cupo disponible para esta fecha. El máximo de personas para {tipo} es {limite}."
        else:
            estado = "pendiente"
            prioridad = cantidad_total + 1
            mensaje = "Solicitud creada exitosamente"
        
        response = (
            supabase
            .table("solicitudes_ausencias")
            .insert({
                "empleado_id": user_id,
                "tipo": tipo,
                "fecha_inicio": fecha_inicio,
                "fecha_fin": fecha_fin,
                "estado": estado,
                "descripcion": descripcion,
                "fecha_solicitud": dt.utcnow().isoformat(),
                "prioridad": prioridad
            })
            .execute()
        )
        
        return jsonify({
            "message": mensaje,
            "solicitud": response.data[0]
        }), 201

    except Exception as e:
        return jsonify({
            "message": "Error creating solicitud",
            "error": str(e)
        }), 500

@app.route("/solicitudes", methods=["GET"])
@verify_token
def listar_solicitudes():
    try:
        if request.rol != "admin":
            response = (
                supabase
                .table("solicitudes_ausencias")
                .select("*")
                .eq("empleado_id", request.user_id)
                .order("fecha_solicitud", desc=False)
                .execute()
            )
        else:
            response = (
                supabase
                .table("solicitudes_ausencias")
                .select("*, empleados!inner(nombre, apellido, email)")
                .order("fecha_solicitud", desc=False)
                .execute()
            )

        return jsonify(response.data), 200

    except Exception as e:
        return jsonify({
            "message": "Error retrieving solicitudes",
            "error": str(e)
        }), 500

@app.route("/solicitudes/<solicitud_id>", methods=["PUT"])
@verify_token
def actualizar_solicitud(solicitud_id):
    try:
        if request.rol != "admin":
            return jsonify({
                "message": "Unauthorized - Admin only"
            }), 403

        datos = request.get_json()
        nuevo_estado = datos.get("estado")

        solicitud_actual = (
            supabase
            .table("solicitudes_ausencias")
            .select("*")
            .eq("id", solicitud_id)
            .execute()
        )

        if len(solicitud_actual.data) == 0:
            return jsonify({
                "message": "Solicitud no encontrada"
            }), 404

        solicitud = solicitud_actual.data[0]
        fecha_inicio = solicitud["fecha_inicio"]
        tipo = solicitud["tipo"]
        estado_actual = solicitud["estado"]

        if estado_actual != "pendiente":
            return jsonify({
                "message": "Esta solicitud ya ha sido procesada"
            }), 400

        if nuevo_estado == "aprobada":
            if tipo == "vacaciones":
                limite = 2
            elif tipo == "permiso":
                limite = 3
            else:
                limite = 999

            response = (
                supabase
                .table("solicitudes_ausencias")
                .select("id", count="exact")
                .eq("fecha_inicio", fecha_inicio)
                .eq("tipo", tipo)
                .eq("estado", "aprobada")
                .execute()
            )
            
            cantidad_aprobadas = len(response.data) if response.data else 0
            
            if cantidad_aprobadas >= limite:
                return jsonify({
                    "message": f"No se puede aprobar. El máximo de personas para {tipo} es {limite}."
                }), 400

            response = (
                supabase
                .table("solicitudes_ausencias")
                .update({
                    "estado": "aprobada",
                    "updated_at": datetime.utcnow().isoformat()
                })
                .eq("id", solicitud_id)
                .execute()
            )

            pendientes = (
                supabase
                .table("solicitudes_ausencias")
                .select("*")
                .eq("fecha_inicio", fecha_inicio)
                .eq("tipo", tipo)
                .eq("estado", "pendiente")
                .order("fecha_solicitud", desc=False)
                .execute()
            )
            
            for i, solicitud_pendiente in enumerate(pendientes.data, 1):
                supabase.table("solicitudes_ausencias").update({
                    "prioridad": i
                }).eq("id", solicitud_pendiente["id"]).execute()

            return jsonify({
                "message": "Solicitud aprobada exitosamente",
                "solicitud": response.data[0]
            }), 200

        if nuevo_estado == "rechazada":
            response = (
                supabase
                .table("solicitudes_ausencias")
                .update({
                    "estado": "rechazada",
                    "updated_at": datetime.utcnow().isoformat()
                })
                .eq("id", solicitud_id)
                .execute()
            )

            pendientes = (
                supabase
                .table("solicitudes_ausencias")
                .select("*")
                .eq("fecha_inicio", fecha_inicio)
                .eq("tipo", tipo)
                .eq("estado", "pendiente")
                .order("fecha_solicitud", desc=False)
                .execute()
            )

            if len(pendientes.data) > 0:
                for i, solicitud_pendiente in enumerate(pendientes.data, 1):
                    supabase.table("solicitudes_ausencias").update({
                        "prioridad": i
                    }).eq("id", solicitud_pendiente["id"]).execute()

            return jsonify({
                "message": "Solicitud rechazada. Las prioridades han sido actualizadas.",
                "solicitud": response.data[0]
            }), 200

        return jsonify({
            "message": "Estado no valido"
        }), 400

    except Exception as e:
        return jsonify({
            "message": "Error updating solicitud",
            "error": str(e)
        }), 500

@app.route("/empleados", methods=["GET"])
@verify_token
def listar_empleados():
    try:
        if request.rol != "admin":
            return jsonify({
                "message": "Unauthorized - Admin only"
            }), 403

        response = (
            supabase
            .table("empleados")
            .select("id, nombre, apellido, email, telefono, puesto, rol")
            .execute()
        )

        return jsonify(response.data), 200

    except Exception as e:
        return jsonify({
            "message": "Error retrieving empleados",
            "error": str(e)
        }), 500

@app.route("/protected", methods=["GET"])
@verify_token
def protected():
    return jsonify({
        "message": f"Welcome {request.username}",
        "rol": request.rol
    }), 200

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )