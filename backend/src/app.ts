import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import documentRoutes from './routes/documentRoutes'
import employeeRoutes from './routes/employeeRoutes'
import requestLogger from './middleware/requestLogger'

const app = express()

/**
 * Security headers
 */
app.use(helmet())


/**
 * CORS
 * Adjust origin in production
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Request logging
app.use(requestLogger);

/**
 * Body parser
 */
app.use(express.json({ limit: '1mb' }))


app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/documents', documentRoutes)
app.use('/employees', employeeRoutes)

export default app