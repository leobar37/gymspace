Implementa los métodos para cumplir el flujo de olvidar contraseña:

1. El usuario llama al controlador solicitando el cambio de contraseña:
    - Archivo: packages/api/src/modules/auth/auth.controller.ts
    - El servidor envía un código de cambio de contraseña al email que desea cambiar.
    - Guarda este código en caché usando el módulo packages/api/src/core/cache.

2. El usuario llama a otro controlador para enviar el código al usuario vía correo:
    - Archivo: packages/api/src/core/auth/services/reset-password-me.service.ts

3. El usuario envía el código que le llegó al correo:
    - Si el código es válido, el servidor debe devolver un token que vence en 20 minutos.
    - El cliente usará este código (internamente lo vincularemos al usuario).

4. En otro controlador, el usuario envía el código y la nueva contraseña:
    - Si el código es válido, se procede con el cambio de contraseña.

5. Agrega el controlador para reenviar el código.

6. Después de cumplir con esto, actualiza el SDK:
    - Archivo: packages/sdk/src/resources/auth.ts