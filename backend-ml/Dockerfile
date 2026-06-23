# --- FastAPI ML service image ---
FROM python:3.11-slim

WORKDIR /app

# Install deps first for layer caching.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service code and the trained model.
COPY . .

EXPOSE 8002

# uvicorn serves the FastAPI app. host 0.0.0.0 so it's reachable from other
# containers. Port 8002 matches ML_SERVICE_URL in the Node backend.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
