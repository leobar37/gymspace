# API Infrastructure with Pulumi

Este proyecto contiene la infraestructura necesaria para desplegar la API de Gymspace en Google Cloud Run.

## Requisitos Previos

1. **Google Cloud CLI** instalado y configurado
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Pulumi CLI** instalado
   ```bash
   brew install pulumi
   ```

3. **Docker** instalado y ejecutándose

4. **Doppler Token** para el ambiente de producción

## Configuración Inicial

1. **Configurar Google Cloud Provider**
   ```bash
   pulumi config set gcp:project YOUR_GCP_PROJECT_ID
   pulumi config set gcp:region us-central1  # o tu región preferida
   ```

2. **Configurar Doppler Token**
   ```bash
   # Obtén tu token de Doppler para producción
   doppler configs tokens create prod-pulumi --plain

   # Configura el token en Pulumi (será encriptado)
   pulumi config set --secret dopplerToken YOUR_DOPPLER_TOKEN
   ```

3. **Habilitar APIs de Google Cloud**
   ```bash
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

4. **Configurar autenticación de Docker con GCR**
   ```bash
   gcloud auth configure-docker
   ```

## Deployment

### Desarrollo
```bash
# Seleccionar el stack de desarrollo
pulumi stack select dev

# Desplegar
pulumi up
```

### Producción
```bash
# Crear stack de producción si no existe
pulumi stack new prod

# Configurar para producción
pulumi config set gcp:project YOUR_PROD_PROJECT_ID
pulumi config set --secret dopplerToken YOUR_PROD_DOPPLER_TOKEN

# Desplegar
pulumi up
```

## Estructura de la Infraestructura

- **Container Registry**: Almacena las imágenes Docker de la API
- **Cloud Run**: Ejecuta la API con auto-scaling
- **Secret Manager**: Almacena el token de Doppler de forma segura
- **IAM**: Configura permisos para acceso público (opcional)

## Recursos Creados

1. **Google Container Registry**
   - Imagen: `gcr.io/[PROJECT_ID]/gymspace-api:[STACK]`

2. **Cloud Run Service**
   - Nombre: `gymspace-api-[STACK]`
   - Región: Configurable (por defecto: us-central1)
   - Auto-scaling: 1-10 instancias
   - Memoria: 1Gi
   - CPU: 1

3. **Secret Manager**
   - Secret: `doppler-token`
   - Contiene el token de Doppler para obtener las variables de entorno

## Outputs

Después del deployment, Pulumi mostrará:
- `serviceUrl`: URL pública de tu API
- `imageName`: Nombre completo de la imagen Docker
- `projectId`: ID del proyecto de GCP
- `region`: Región donde se desplegó

## Actualizar la API

Para actualizar la API después de cambios en el código:

```bash
# El build y push de la imagen Docker se hace automáticamente
pulumi up
```

## Eliminar la Infraestructura

```bash
pulumi destroy
```

## Troubleshooting

### Error de autenticación con Docker
```bash
gcloud auth configure-docker
```

### Error de permisos en Google Cloud
Asegúrate de que tu cuenta tenga los siguientes roles:
- Cloud Run Admin
- Storage Admin
- Secret Manager Admin
- Service Account User

### La API no inicia correctamente
Verifica los logs en Cloud Run:
```bash
gcloud run services logs read gymspace-api-[STACK] --region=[REGION]
```

## Costos Estimados

- **Cloud Run**: ~$0.00002400/vCPU-segundo + ~$0.00000250/GiB-segundo
- **Container Registry**: ~$0.10/GB almacenado
- **Secret Manager**: $0.06/10K operaciones

Con el auto-scaling configurado (1-10 instancias), los costos variarán según el tráfico.
