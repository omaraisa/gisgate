// Global type declarations
import 'react'
import 'react-dom'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      JWT_SECRET: string
      PAYPAL_CLIENT_ID: string
      PAYPAL_CLIENT_SECRET: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}