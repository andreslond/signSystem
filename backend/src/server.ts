require('dotenv').config()

import app from './app'

const port = process.env.PORT || 3000
const host = process.env.HOST || '0.0.0.0'

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`)
})
