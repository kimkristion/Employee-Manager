INSERT INTO departments (id, name)
VALUES (001, 'Sales'),
(002, 'Legal'),
(003, 'Finance'),
(004, 'Engineering');

INSERT INTO roles (id, title, salary, department_id)
VALUES (1, 'Manager', 75000.00, 001),
(2, 'Legal Counsel', 90000.00, 002),
(3, 'Financial Analyst', 65000.00, 003),
(4, 'Financial Advisor', 70000.00, 003),
(5, 'Software Engineer', 65000.00, 004),
(6, 'Sales Associate', 45000.00, 001),
(7, 'Legal Team Lead', 105000.00, 002);

INSERT INTO employees (id, first_name, last_name, role_id, manager_id )
VALUES (1, 'John', 'Doe', 1, NULL),
(2, 'Mike', 'Chan', 6, 1),
(3, 'Kevin', 'Tupik', 3, NULL),
(4, 'Sarah', 'Lourd', 4, 3),
(5, 'Tom', 'Allen', 7, NULL),
(6, 'Jerry', 'White', 2, 5);




