import os
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.use_s3 = False
        self.bucket_name = settings.S3_BUCKET_NAME
        
        try:
            # Initialize S3 Client
            self.s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                endpoint_url=settings.S3_ENDPOINT_URL,
                region_name="us-east-1"
            )
            
            # Verify connectivity by trying to head/create the bucket
            try:
                self.s3_client.head_bucket(Bucket=self.bucket_name)
            except ClientError as e:
                # If bucket doesn't exist, create it
                if e.response['Error']['Code'] == '404':
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                else:
                    raise e
            
            # Apply public read-only bucket policy so the browser can load the images directly
            import json
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicRead",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"]
                    }
                ]
            }
            try:
                self.s3_client.put_bucket_policy(Bucket=self.bucket_name, Policy=json.dumps(policy))
                logger.info(f"Public read policy applied to bucket: {self.bucket_name}")
            except Exception as policy_err:
                logger.warning(f"Could not apply public read policy to bucket {self.bucket_name}: {policy_err}")
                    
            self.use_s3 = True
            logger.info(f"S3 compatible storage connected at {settings.S3_ENDPOINT_URL}. Bucket: {self.bucket_name}")
            
        except Exception as e:
            logger.warning(f"S3 connection failed: {e}. Falling back to local static directory storage.")
            self.local_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
            os.makedirs(os.path.join(self.local_dir, "scans"), exist_ok=True)
            os.makedirs(os.path.join(self.local_dir, "heatmaps"), exist_ok=True)
            os.makedirs(os.path.join(self.local_dir, "reports"), exist_ok=True)

    def save_file(self, file_bytes: bytes, relative_path: str, content_type: str = "image/png") -> str:
        """
        Saves files into storage and returns the retrieval HTTP URL.
        Parameters:
            - file_bytes: bytes data
            - relative_path: relative target path, e.g., 'scans/uuid.png' or 'reports/uuid.pdf'
        """
        if self.use_s3:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=relative_path,
                    Body=file_bytes,
                    ContentType=content_type
                )
                # Return the configured S3 endpoint URL or public URL
                return f"{settings.S3_ENDPOINT_URL}/{self.bucket_name}/{relative_path}"
            except Exception as e:
                logger.error(f"S3 upload error: {e}. Retrying with local write.")

        # Local fallback
        local_base = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
        dest_path = os.path.join(local_base, relative_path)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        with open(dest_path, "wb") as f:
            f.write(file_bytes)
            
        # Return path that maps to static FastAPI mount (e.g., /static/scans/uuid.png)
        return f"/static/{relative_path}"

storage_service = StorageService()
