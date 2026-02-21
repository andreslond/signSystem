import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchEmployees, fetchEmployeeById, updateEmployee as apiUpdateEmployee, ApiError } from '../lib/apiClient';
import { logAppError } from '../utils/errorHandlers';

function createPaginationState(initialPage = 1, initialLimit = 10) {
    return {
        page: initialPage,
        limit: initialLimit,
        totalPages: 1,
        total: 0,
    };
}

export function useEmployees({
    initialPage = 1,
    initialLimit = 10,
    initialSearch = ''
} = {}) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState(initialSearch);

    const [pagination, setPagination] = useState(() => createPaginationState(initialPage, initialLimit));

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchEmployeesData = useCallback(async () => {
        if (!isMounted.current) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetchEmployees({
                page: pagination.page,
                limit: pagination.limit,
                search
            });

            const employeesData = response.data || [];
            const paginationMeta = response.pagination || {
                total: employeesData.length,
                page: pagination.page,
                limit: pagination.limit,
                totalPages: 1,
            };

            if (isMounted.current) {
                setEmployees(employeesData);
                setPagination(prev => ({
                    ...prev,
                    total: paginationMeta.total,
                    totalPages: paginationMeta.totalPages,
                }));
            }
        } catch (err) {
            if (isMounted.current) {
                logAppError('useEmployees:fetchEmployees', err);
                setError(err);
                setEmployees([]);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [pagination.page, pagination.limit, search]);

    useEffect(() => {
        fetchEmployeesData();
    }, [fetchEmployeesData]);

    const goToPage = useCallback((page) => {
        const validPage = Math.max(1, Math.min(page, pagination.totalPages));
        setPagination(prev => ({ ...prev, page: validPage }));
    }, [pagination.totalPages]);

    const setLimit = useCallback((limit) => {
        setPagination(prev => ({ ...prev, limit, page: 1 }));
    }, []);

    return {
        employees,
        loading,
        error,
        search,
        setSearch,
        refetch: fetchEmployeesData,
        pagination: {
            ...pagination,
            goToPage,
            setLimit,
        }
    };
}

export function useEmployee(employeeId) {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchEmployee = useCallback(async () => {
        if (!employeeId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetchEmployeeById(employeeId);
            if (isMounted.current) {
                // API returns { data: employee } - extract the employee data
                const employeeData = response.data || response;
                setEmployee(employeeData);
            }
        } catch (err) {
            if (isMounted.current) {
                logAppError('useEmployee:fetchEmployee', err);
                setError(err);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [employeeId]);

    useEffect(() => {
        fetchEmployee();
    }, [fetchEmployee]);

    const updateEmployeeData = async (data) => {
        try {
            const response = await apiUpdateEmployee(employeeId, data);
            const updatedData = response.data || response;
            setEmployee(prev => ({ ...prev, ...updatedData }));
            return updatedData;
        } catch (err) {
            logAppError('useEmployee:update', err);
            throw err;
        }
    };

    return {
        employee,
        loading,
        error,
        refetch: fetchEmployee,
        updateEmployee: updateEmployeeData
    };
}
