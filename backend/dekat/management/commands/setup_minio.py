import json
import logging
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Create MinIO bucket and set public-read policy'

    def handle(self, *args, **kwargs):
        if not settings.USE_MINIO:
            self.stdout.write('MinIO not enabled, skipping.')
            return

        import boto3
        from botocore.exceptions import ClientError

        s3 = boto3.client(
            's3',
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        bucket = settings.AWS_STORAGE_BUCKET_NAME

        try:
            s3.create_bucket(Bucket=bucket)
            self.stdout.write(f'Bucket "{bucket}" created.')
        except ClientError as e:
            code = e.response['Error']['Code']
            if code in ('BucketAlreadyOwnedByYou', 'BucketAlreadyExists'):
                self.stdout.write(f'Bucket "{bucket}" already exists.')
            else:
                self.stdout.write(self.style.ERROR(f'Error creating bucket: {e}'))
                return

        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket}/*"]
            }]
        }
        try:
            s3.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy))
            self.stdout.write(self.style.SUCCESS(f'Bucket "{bucket}" is public-read.'))
        except ClientError as e:
            self.stdout.write(self.style.ERROR(f'Failed to set policy: {e}'))
