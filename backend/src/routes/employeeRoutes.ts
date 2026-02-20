import { Router } from 'express'
import { EmployeeController } from '../controllers/EmployeeController'
import { EmployeeService } from '../services/EmployeeService'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

const createEmployeeService = (req: any, res: any, next: any) => {
    req.employeeService = new EmployeeService(req.userToken)
    next()
}

const getEmployeeController = () => {
    return new EmployeeController()
}

router.get('/', authMiddleware, createEmployeeService, (req, res) => {
    const controller = getEmployeeController()
    return controller.getEmployees(req, res)
})

router.get('/:id', authMiddleware, createEmployeeService, (req, res) => {
    const controller = getEmployeeController()
    return controller.getEmployeeById(req, res)
})

router.put('/:id', authMiddleware, createEmployeeService, (req, res) => {
    const controller = getEmployeeController()
    return controller.updateEmployee(req, res)
})

export default router
