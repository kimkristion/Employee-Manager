const inquirer = require('inquirer');
const mysql = require('mysql2');



const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'cyberVault_db'
});

const promiseConnection = connection.promise();


async function viewAllEmployees() {
    try {
        const [rows] = await promiseConnection.execute('SELECT employees.id, employees.first_name, employees.last_name, roles.title AS role_title, employees.manager_id AS employee_manager FROM employees JOIN roles ON employees.role_id = roles.id');
        console.log('');

        let maxIdWidth = 2;
        let maxFirstNameWidth = 10;
        let maxLastNameWidth = 9;
        let maxTitleWidth = 11;
        let maxManagerWidth = 5;

        for (const row of rows) {
            maxIdWidth = Math.max(maxIdWidth, String(row.id).length);
            maxFirstNameWidth = Math.max(maxFirstNameWidth, String(row.first_name).length);
            maxLastNameWidth = Math.max(maxLastNameWidth, String(row.last_name).length);
            maxTitleWidth = Math.max(maxTitleWidth, String(row.role_title).length);
            maxManagerWidth = Math.max(maxManagerWidth, String(row.manager_id).length);
        }

        console.log(`id${' '.repeat(maxIdWidth - 2)}\tfirst_name${' '.repeat(maxFirstNameWidth - 9)}\tlast_name${' '.repeat(maxLastNameWidth - 8)}\ttitle${' '.repeat(maxTitleWidth - 5)}\tmanager${' '.repeat(maxManagerWidth - 6)}`);
        console.log(`${'-'.repeat(maxIdWidth)}\t${'-'.repeat(maxFirstNameWidth)}\t${'-'.repeat(maxLastNameWidth)}\t${'-'.repeat(maxTitleWidth)}\t${'-'.repeat(maxManagerWidth)}`);

        for (const row of rows) {
            console.log(`${String(row.id).padEnd(maxIdWidth)}\t${row.first_name.padEnd(maxFirstNameWidth)}\t${row.last_name.padEnd(maxLastNameWidth)}\t${String(row.role_title).padEnd(maxTitleWidth)}\t${String(row.employee_manager).padEnd(maxManagerWidth)}`);
        }
        console.log('');
    } catch (err) {
        if (err) {
            console.error('Internal server error', err);
        }
    }
};


async function addEmployee() {
    const [roleRows] = await promiseConnection.execute('SELECT title FROM roles');
    const roleNames = roleRows.map((row) => row.title);

    const [employeesRows] = await promiseConnection.execute('SELECT DISTINCT manager_id FROM employees WHERE manager_id IS NOT NULL');
    const managerNames = employeesRows.map((row) => row.manager_id ? row.manager_id : 'None');

    const employeeInformation = await inquirer.prompt([
        {
            type: 'input',
            name: 'first_name',
            message: 'What is the first name of the employee? '
        },
        { 
            type: 'input',
            name: 'last_name',
            message: 'What is the last name of the employee? '
        },
        {
            type: 'list',
            name: 'employeeRole',
            message: 'What is the role of the employee? ',
            choices: roleNames,
        },
        {
            type: 'list',
            name: 'manager',
            message: 'Who is the manager to the employee? ',
            choices: managerNames.concat('None'), 
        }
    ]);

    const SQLQuery = `
    INSERT INTO employees (first_name, last_name, role_id, manager_id)
    VALUES (?, ?, ?, ?)`;

    try {
        await promiseConnection.execute(SQLQuery, [
            employeeInformation.first_name,
            employeeInformation.last_name,
            roleNames.indexOf(employeeInformation.employeeRole) + 1,
            employeeInformation.manager
        ]);
        console.log('Employee added successfully');
    } catch (err) {
        console.error('Error adding employee', err);
    }
};



async function deleteEmployee() {
    const [employeesRows] = await promiseConnection.execute('SELECT id, CONCAT(first_name, " ", last_name) AS fullName FROM employees');
    const employees = employeesRows.map((row) => ({ id: row.id, fullName: row.fullName }));

    const employeeSelection = await inquirer.prompt([
        {
            type: 'list',
            name: 'employeeId',
            message: 'Which employee would you like to delete?',
            choices: employees.map((employee) => ({ name: employee.fullName, value: employee.id })),
        }
    ]);

    const employeeIdToDelete = employeeSelection.employeeId;

    const SQLUpdateQuery = `
        UPDATE employees
        SET manager_id = NULL
        WHERE manager_id = ?`;

    const SQLDeleteQuery = `
        DELETE FROM employees
        WHERE id = ?`;

    try {
        await promiseConnection.execute(SQLUpdateQuery, [employeeIdToDelete]);

        await promiseConnection.execute(SQLDeleteQuery, [employeeIdToDelete]);

        console.log('Employee deleted successfully');
    } catch (err) {
        console.error('Error deleting employee', err);
    }
};

async function updateEmployeeRole() {
    // Fetch the list of employees
    const [employeesRows] = await promiseConnection.execute('SELECT id, CONCAT(first_name, " ", last_name) AS fullName FROM employees');
    const employees = employeesRows.map((row) => ({ id: row.id, fullName: row.fullName }));

    // Fetch the list of roles
    const [rolesRows] = await promiseConnection.execute('SELECT id, title FROM roles');
    const roles = rolesRows.map((row) => ({ id: row.id, title: row.title }));

    // Prompt the user to select an employee and a new role
    const employeeRoleUpdate = await inquirer.prompt([
        {
            type: 'list',
            name: 'employeeId',
            message: 'Which employee would you like to update?',
            choices: employees.map((employee) => ({ name: employee.fullName, value: employee.id })),
        },
        {
            type: 'list',
            name: 'newRoleId',
            message: 'Select the new role for the employee:',
            choices: roles.map((role) => ({ name: role.title, value: role.id })),
        }
    ]);

    const { employeeId, newRoleId } = employeeRoleUpdate;

    // Update the employee's role
    const SQLUpdateQuery = `
        UPDATE employees
        SET role_id = ?
        WHERE id = ?`;

    try {
        // Execute the update query
        await promiseConnection.execute(SQLUpdateQuery, [newRoleId, employeeId]);

        console.log('Employee role updated successfully');
    } catch (err) {
        console.error('Error updating employee role', err);
    }
};

async function viewAllRoles() {
    try {
        const [rows] = await promiseConnection.execute('SELECT roles.id, roles.title, roles.salary, departments.name AS department_name FROM roles JOIN departments ON roles.department_id = departments.id;');
        console.log('');

        // Initialize variables to store maximum column widths
        let maxIdWidth = 2; // Minimum width for 'id' column
        let maxTitleWidth = 5; // Minimum width for 'title' column
        let maxDepartmentWidth = 10; // Minimum width for 'department' column
        let maxSalaryWidth = 6; // Minimum width for 'salary' column

        for (const row of rows) {
            // Update maximum column widths based on actual data
            maxIdWidth = Math.max(maxIdWidth, String(row.id).length);
            maxTitleWidth = Math.max(maxTitleWidth, row.title.length);
            maxDepartmentWidth = Math.max(maxDepartmentWidth, String(row.department_id).length);
            maxSalaryWidth = Math.max(maxSalaryWidth, String(row.salary).length);
        }

        console.log(`id${' '.repeat(maxIdWidth - 2)}\ttitle${' '.repeat(maxTitleWidth - 5)}\tdepartment${' '.repeat(maxDepartmentWidth - 10)}\tsalary${' '.repeat(maxSalaryWidth - 6)}`);
        console.log(`${'-'.repeat(maxIdWidth)}\t${'-'.repeat(maxTitleWidth)}\t${'-'.repeat(maxDepartmentWidth)}\t${'-'.repeat(maxSalaryWidth)}`);

        for (const row of rows) {
            console.log(`${String(row.id).padEnd(maxIdWidth)}\t${row.title.padEnd(maxTitleWidth)}\t${String(row.department_name).padEnd(maxDepartmentWidth)}\t${String(row.salary).padEnd(maxSalaryWidth)}`);
        }
        console.log('');
    } catch (error) {
        console.error('Internal Server Error');
    }
};


async function addRole() {
    const [departmentRows] = await promiseConnection.execute('SELECT name FROM departments;');
    const departments = departmentRows.map((row) => row.name);

    const roleInformation = await inquirer.prompt ([
        {
            type: 'input',
            name: 'title',
            message: 'What is the name of the role? '
        },
        {
            type: 'input',
            name: 'salary',
            message: 'What is the salary of the role? '
        },
        {
            type: 'list',
            name: 'department',
            message: 'Which department does the role belong to? ',
            choices: departments
        }
    ]);

    const SQLQuery = `
    INSERT INTO roles (title, salary, department_id) 
    VALUES (?, ?, ?)`;

    try {
        await promiseConnection.execute(SQLQuery, [
            roleInformation.title,
            roleInformation.salary,
            departments.indexOf(roleInformation.department) + 1,
        ]);
        console.log('Role added successfully')
    } catch (err) {
        console.error('Error adding role', err);
    }
};

async function deleteRole() {
    const [rolesRows] = await promiseConnection.execute('SELECT id, title FROM roles');
    const roles = rolesRows.map((row) => ({ id: row.id, title: row.title }));

    const roleSelection = await inquirer.prompt([
        {
            type: 'list',
            name: 'roleId',
            message: 'Which role would you like to delete?',
            choices: roles.map((role) => ({ name: role.title, value: role.id })),
        }
    ]);

    const roleIdToDelete = roleSelection.roleId;

    const SQLUpdateQuery = `
        UPDATE employees
        SET role_id = NULL
        WHERE role_id = ?`;

    const SQLDeleteQuery = `
        DELETE FROM roles
        WHERE id = ?`;

    try {
        await promiseConnection.execute(SQLUpdateQuery, [roleIdToDelete]);

        await promiseConnection.execute(SQLDeleteQuery, [roleIdToDelete]);

        console.log('Role deleted successfully');
    } catch (err) {
        console.error('Error deleting role', err);
    }
};

async function viewAllDepartments() {
    try {
        const [rows] = await promiseConnection.execute('SELECT * FROM departments');
        console.log('')

        let maxIdWidth = 2;
        let maxDepartmentWidth = 11;

        for (const row of rows) {
            maxIdWidth = Math.max(maxIdWidth, String(row.id).length);
            maxDepartmentWidth = Math.max(maxDepartmentWidth, String(row.name).length);
        }

        console.log(`id${' '.repeat(maxIdWidth - 2)}\tDepartment${' '.repeat(maxDepartmentWidth - 11)}`)
        console.log(`${'-'.repeat(maxIdWidth)}\t${'-'.repeat(maxDepartmentWidth)}`)

        for (const row of rows) {
            console.log(`${row.id}\t${row.name}`);
        }
        console.log('')
    } catch (error) {
        console.error('Internal Server Error');
    }
};


async function addDepartment() {
    const departmentInformatiom = await inquirer.prompt ([
        {
            type: 'input',
            name: 'department',
            message: 'What is the name of the department? '
        }
    ]);

    SQLQuery = `
    INSERT INTO departments (name)
    VALUE (?)`

    try {
        await promiseConnection.execute(SQLQuery, [
            departmentInformatiom.department
        ]);
        console.log('Department added successfully')
    } catch (err) {
        console.error('Error adding department', err);
    }
};



async function deleteDepartment() {
    const [departmentsRows] = await promiseConnection.execute('SELECT id, name FROM departments');
    const departments = departmentsRows.map((row) => ({ id: row.id, name: row.name }));

    const departmentSelection = await inquirer.prompt([
        {
            type: 'list',
            name: 'departmentId',
            message: 'Which department would you like to delete?',
            choices: departments.map((department) => ({ name: department.name, value: department.id })),
        }
    ]);

    const departmentIdToDelete = departmentSelection.departmentId;

    // Update the department_id of roles belonging to the deleted department to NULL (or handle accordingly)
    const SQLUpdateRolesQuery = `
        UPDATE roles
        SET department_id = NULL
        WHERE department_id = ?`;

    // Delete the selected department
    const SQLDeleteDepartmentQuery = `
        DELETE FROM departments
        WHERE id = ?`;

    try {
        // Update the department_id of roles belonging to the deleted department to NULL
        await promiseConnection.execute(SQLUpdateRolesQuery, [departmentIdToDelete]);

        // Delete the selected department
        await promiseConnection.execute(SQLDeleteDepartmentQuery, [departmentIdToDelete]);

        console.log('Department deleted successfully');
    } catch (err) {
        console.error('Error deleting department', err);
    }
};



const scriptSheet = [
    'View All Employees', 
    'Add Employee',
    'Delete Employee', 
    'Update Employee Role', 
    'View All Roles', 
    'Add Role', 
    'Delete Role',
    'View All Departments', 
    'Add Department', 
    'Delete Department',
    'Quit'
];

async function displayManagerTool() {
   
    const userSelection = await inquirer.prompt([
        {
            type: 'list',
            name: 'userList',
            message: 'What would you like to do?',
            choices: scriptSheet,
        }
    ]);

    switch (userSelection.userList) {
        case 'View All Employees':
            await viewAllEmployees();
            break;
        case 'Add Employee':
            await addEmployee();
            break;
        case 'Delete Employee':
            await deleteEmployee();
            break;
        case 'Update Employee Role':
            await updateEmployeeRole();
            break;
        case 'View All Roles':
            await viewAllRoles();
            break;
        case 'Add Role':
            await addRole();
            break;
        case 'Delete Role':
            await deleteRole();
            break;
        case 'View All Departments':
            await viewAllDepartments();
            break;
        case 'Add Department':
            await addDepartment();
            break;
        case 'Delete Department':
            await deleteDepartment();
            break;
        case 'Quit':
            return;
    }

    await displayManagerTool();
}


console.log(`
███████╗███╗░░░███╗██████╗░██╗░░░░░░█████╗░██╗░░░██╗███████╗███████╗
██╔════╝████╗░████║██╔══██╗██║░░░░░██╔══██╗╚██╗░██╔╝██╔════╝██╔════╝
█████╗░░██╔████╔██║██████╔╝██║░░░░░██║░░██║░╚████╔╝░█████╗░░█████╗░░
██╔══╝░░██║╚██╔╝██║██╔═══╝░██║░░░░░██║░░██║░░╚██╔╝░░██╔══╝░░██╔══╝░░
███████╗██║░╚═╝░██║██║░░░░░███████╗╚█████╔╝░░░██║░░░███████╗███████╗
╚══════╝╚═╝░░░░░╚═╝╚═╝░░░░░╚══════╝░╚════╝░░░░╚═╝░░░╚══════╝╚══════╝

███╗░░░███╗░█████╗░███╗░░██╗░█████╗░░██████╗░███████╗██████╗░
████╗░████║██╔══██╗████╗░██║██╔══██╗██╔════╝░██╔════╝██╔══██╗
██╔████╔██║███████║██╔██╗██║███████║██║░░██╗░█████╗░░██████╔╝
██║╚██╔╝██║██╔══██║██║╚████║██╔══██║██║░░╚██╗██╔══╝░░██╔══██╗
██║░╚═╝░██║██║░░██║██║░╚███║██║░░██║╚██████╔╝███████╗██║░░██║
╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝░░╚═╝░╚═════╝░╚══════╝╚═╝░░╚═╝
`);

displayManagerTool();
