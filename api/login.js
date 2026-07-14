import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido"
        });
    }

    try {
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SECRET_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );

        const telefono =
            String(req.body?.telefono || "")
                .replace(/\D/g, "");

        const key =
            String(req.body?.key || "")
                .trim();

        if (!telefono || !key) {
            return res.status(400).json({
                error: "Ingresa teléfono y contraseña"
            });
        }

        if (telefono.length !== 10) {
            return res.status(400).json({
                error: "El teléfono debe tener 10 dígitos"
            });
        }

        const { data: usuario, error } =
            await supabaseAdmin
                .from("ccp_clientes")
                .select("id,nombre,telefono,rol,activo,key")
                .eq("telefono", telefono)
                .eq("activo", true)
                .maybeSingle();

        if (error) {
            console.error("Error Supabase:", error);

            return res.status(500).json({
                error: "Error consultando el usuario"
            });
        }

        if (!usuario || usuario.key !== key) {
            return res.status(401).json({
                error: "Teléfono o contraseña incorrectos"
            });
        }

        return res.status(200).json({
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                telefono: usuario.telefono,
                rol: Number(usuario.rol)
            }
        });

    } catch (error) {
        console.error("Error en login:", error);

        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
}