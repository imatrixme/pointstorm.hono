export const CRYPTO_KEYS = {
  // HMAC签名密钥
  hmacKey: 'HNs.Twq8QrR=UAcGe6Nj',
  
  // AES加密密钥
  aesKey: ';WBQnKAV)2rMPqVCBks3',
  
  // JWT密钥（预留给PocketBase）
  jwtSecret: process.env.JWT_SECRET || 'pointstorm_jwt_secret_key_2024'
}

export const ALGORITHMS = {
  hmac: 'sha1',
  aes: 'aes-256-ctr'
} as const