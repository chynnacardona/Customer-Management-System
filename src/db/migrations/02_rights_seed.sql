CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'USER'
);

CREATE TABLE Module (
    module_id VARCHAR(20) PRIMARY KEY,
    module_name VARCHAR(100)
);

CREATE TABLE rights (
    right_id VARCHAR(20) PRIMARY KEY,
    right_name VARCHAR(100)
);

CREATE TABLE user_module (
    user_id INT REFERENCES "user"(user_id),
    module_id VARCHAR(20) REFERENCES Module(module_id),
    PRIMARY KEY (user_id, module_id)
);

CREATE TABLE UserModule_Rights (
    user_id INT,
    module_id VARCHAR(20),
    right_id VARCHAR(20) REFERENCES rights(right_id),
    is_allowed INT DEFAULT 1, -- 1 for true, 0 for false
    PRIMARY KEY (user_id, module_id, right_id),
    FOREIGN KEY (user_id, module_id) REFERENCES user_module(user_id, module_id)
);

-- Seed Modules
INSERT INTO Module (module_id, module_name) VALUES 
('Cust_Mod', 'Customer Module'),
('Sales_Mod', 'Sales Module'),
('Prod_Mod', 'Product Module'),
('Adm_Mod', 'Admin Module');

-- Seed Rights
INSERT INTO rights (right_id, right_name) VALUES 
('CUST_VIEW', 'View Customer'), ('CUST_ADD', 'Add Customer'), 
('CUST_EDIT', 'Edit Customer'), ('CUST_DEL', 'Delete Customer'),
('SALES_VIEW', 'View Sales'), ('SD_VIEW', 'View Sales Detail'),
('PROD_VIEW', 'View Product'), ('PRICE_VIEW', 'View Price History'),
('ADM_USER', 'Admin User');

-- Create the Superadmin user
INSERT INTO "user" (email, full_name, role) 
VALUES ('jcesperanza@neu.edu.ph', 'Jeremias Esperanza', 'SUPERADMIN');

-- Link User to all 4 Modules
INSERT INTO user_module (user_id, module_id)
SELECT u.user_id, m.module_id FROM "user" u, Module m 
WHERE u.email = 'jcesperanza@neu.edu.ph';

-- Grant all 9 Rights to the Superadmin (value = 1)
INSERT INTO UserModule_Rights (user_id, module_id, right_id, is_allowed)
SELECT um.user_id, um.module_id, r.right_id, 1
FROM user_module um, rights r
WHERE (SELECT email FROM "user" WHERE user_id = um.user_id) = 'jcesperanza@neu.edu.ph';
