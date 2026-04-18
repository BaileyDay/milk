import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

let _r2: S3Client | null = null;

function getClient(): S3Client {
	if (!_r2) {
		_r2 = new S3Client({
			region: 'auto',
			endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY
			}
		});
	}
	return _r2;
}

export async function uploadToR2(
	key: string,
	body: Buffer | Uint8Array,
	contentType: string
): Promise<string> {
	await getClient().send(
		new PutObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
			Body: body,
			ContentType: contentType
		})
	);

	return `${env.R2_PUBLIC_URL}/${key}`;
}
