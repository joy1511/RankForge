# RankForge Deployment Guide

## Production Deployment Options

### Option 1: Docker Deployment

1. **Build the Docker image:**
```bash
docker build -t rankforge:latest .
```

2. **Run with Docker Compose:**
```bash
docker-compose up -d
```

3. **Check logs:**
```bash
docker-compose logs -f
```

### Option 2: Direct Deployment

1. **Set up virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Run with Gunicorn:**
```bash
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 300 \
  --access-logfile - \
  --error-logfile -
```

### Option 3: Cloud Deployment (AWS/GCP/Azure)

#### AWS Elastic Beanstalk

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize:
```bash
eb init -p python-3.11 rankforge
```

3. Create environment:
```bash
eb create rankforge-prod
```

4. Deploy:
```bash
eb deploy
```

#### Google Cloud Run

1. Build and push:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/rankforge
```

2. Deploy:
```bash
gcloud run deploy rankforge \
  --image gcr.io/PROJECT_ID/rankforge \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Container Instances

1. Build and push:
```bash
az acr build --registry myregistry --image rankforge:latest .
```

2. Deploy:
```bash
az container create \
  --resource-group myResourceGroup \
  --name rankforge \
  --image myregistry.azurecr.io/rankforge:latest \
  --dns-name-label rankforge \
  --ports 8000
```

## Environment Variables

Required environment variables:

```bash
# API Keys (Required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional

# Application Settings
APP_NAME=RankForge
APP_VERSION=1.0.0
LOG_LEVEL=INFO
ENVIRONMENT=production

# Performance
MAX_WORKERS=4
ENABLE_CACHING=true
CACHE_TTL=3600
REQUEST_TIMEOUT=300

# AI Models
RESEARCHER_MODEL=gpt-4-turbo-preview
WRITER_MODEL=gpt-4-turbo-preview
EDITOR_MODEL=gpt-4-turbo-preview
TEMPERATURE=0.7
MAX_TOKENS=4000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
RATE_LIMIT_PER_HOUR=100
```

## Performance Tuning

### Worker Configuration

For CPU-bound workloads:
```bash
workers = (2 * CPU_cores) + 1
```

For I/O-bound workloads (recommended for RankForge):
```bash
workers = (2 * CPU_cores) + 1
worker_class = uvicorn.workers.UvicornWorker
```

### Timeout Settings

Adjust based on your needs:
```bash
--timeout 300  # 5 minutes for blog generation
--graceful-timeout 30
--keep-alive 5
```

## Monitoring

### Health Checks

```bash
curl http://localhost:8000/api/v1/health
```

### Logging

Logs are output to stdout/stderr. Configure log aggregation:

- **CloudWatch** (AWS)
- **Stackdriver** (GCP)
- **Application Insights** (Azure)
- **ELK Stack** (Self-hosted)

### Metrics

Monitor these key metrics:

- Request latency (p50, p95, p99)
- Error rate
- API key usage
- Memory consumption
- CPU utilization

## Security Best Practices

1. **API Key Management:**
   - Use secrets manager (AWS Secrets Manager, GCP Secret Manager)
   - Rotate keys regularly
   - Never commit keys to version control

2. **Network Security:**
   - Use HTTPS in production
   - Configure CORS appropriately
   - Implement rate limiting
   - Use API gateway for authentication

3. **Input Validation:**
   - All inputs are validated via Pydantic
   - Implement additional rate limiting per IP
   - Monitor for abuse patterns

## Scaling

### Horizontal Scaling

1. **Load Balancer:**
   - Use ALB (AWS), Cloud Load Balancing (GCP), or Azure Load Balancer
   - Configure health checks
   - Enable sticky sessions if needed

2. **Auto-scaling:**
   - Scale based on CPU/memory usage
   - Scale based on request queue length
   - Set min/max instance counts

### Vertical Scaling

Recommended instance sizes:

- **Small**: 2 vCPU, 4GB RAM (development)
- **Medium**: 4 vCPU, 8GB RAM (production)
- **Large**: 8 vCPU, 16GB RAM (high traffic)

## Backup and Recovery

1. **Configuration Backup:**
   - Store .env files securely
   - Version control all code
   - Document custom configurations

2. **Disaster Recovery:**
   - Multi-region deployment
   - Automated failover
   - Regular backup testing

## Cost Optimization

1. **API Usage:**
   - Monitor OpenAI API costs
   - Implement caching for repeated requests
   - Use appropriate model sizes

2. **Infrastructure:**
   - Use spot instances for non-critical workloads
   - Implement auto-scaling to match demand
   - Use reserved instances for baseline capacity

## Troubleshooting

### Common Issues

1. **Timeout Errors:**
   - Increase `REQUEST_TIMEOUT`
   - Check OpenAI API status
   - Verify network connectivity

2. **Memory Issues:**
   - Reduce `MAX_WORKERS`
   - Increase instance memory
   - Monitor for memory leaks

3. **Rate Limiting:**
   - Check OpenAI rate limits
   - Implement request queuing
   - Use multiple API keys

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=DEBUG
```

## Support

For issues and questions:
- Check logs first
- Review API documentation at `/docs`
- Monitor system metrics
