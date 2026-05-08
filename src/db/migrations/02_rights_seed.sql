CREATE TABLE "user" (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    user_type VARCHAR(20) NOT NULL DEFAULT 'USER',
    record_status VARCHAR(10) NOT NULL DEFAULT 'INACTIVE'
);

CREATE TABLE Module (
    module_id VARCHAR(20) PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(20) NOT NULL DEFAULT 'SEEDED'
);

CREATE TABLE rights (
    right_id VARCHAR(20) PRIMARY KEY,
    right_name VARCHAR(100) NOT NULL,
    default_value INT NOT NULL DEFAULT 1 CHECK (default_value IN (0,1)),
    module_id VARCHAR(20) NOT NULL REFERENCES Module(module_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(20) NOT NULL DEFAULT 'SEEDED'
);

CREATE TABLE user_module (
    user_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    module_id VARCHAR(20) NOT NULL REFERENCES Module(module_id) ON DELETE CASCADE,
    rights_value INT NOT NULL DEFAULT 1 CHECK (rights_value IN (0,1)),
    PRIMARY KEY (user_id, module_id)
);

CREATE TABLE UserModule_Rights (
    user_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    module_id VARCHAR(20) NOT NULL REFERENCES Module(module_id),
    right_id VARCHAR(20) NOT NULL REFERENCES rights(right_id),
    is_allowed INT DEFAULT 1 CHECK (is_allowed IN (0,1)),
    PRIMARY KEY (user_id, module_id, right_id),
    FOREIGN KEY (user_id, module_id)
        REFERENCES user_module(user_id, module_id)
);

-- Seed Modules
INSERT INTO Module VALUES
('Cust_Mod', 'Customer Module', 'ACTIVE', 'SEEDED'),
('Sales_Mod', 'Sales Module', 'ACTIVE', 'SEEDED'),
('Prod_Mod', 'Product Module', 'ACTIVE', 'SEEDED'),
('Adm_Mod', 'Admin Module', 'ACTIVE', 'SEEDED');

-- Seed Rights
INSERT INTO rights VALUES
('CUST_VIEW', 'View Customer', 1, 'Cust_Mod', 'ACTIVE', 'SEEDED'),
('CUST_ADD', 'Add Customer', 1, 'Cust_Mod', 'ACTIVE', 'SEEDED'),
('CUST_EDIT', 'Edit Customer', 1, 'Cust_Mod', 'ACTIVE', 'SEEDED'),
('CUST_DEL', 'Delete Customer', 1, 'Cust_Mod', 'ACTIVE', 'SEEDED'),
('SALES_VIEW', 'View Sales', 1, 'Sales_Mod', 'ACTIVE', 'SEEDED'),
('SD_VIEW', 'View Sales Detail', 1, 'Sales_Mod', 'ACTIVE', 'SEEDED'),
('PROD_VIEW', 'View Product', 1, 'Prod_Mod', 'ACTIVE', 'SEEDED'),
('PRICE_VIEW', 'View Price History', 1, 'Prod_Mod', 'ACTIVE', 'SEEDED'),
('ADM_USER', 'Admin User', 1, 'Adm_Mod', 'ACTIVE', 'SEEDED');

-- Create the Superadmin user
INSERT INTO "user" (user_id, email, full_name, user_type, record_status)
SELECT
    id,
    email,
    'Jeremias Esperanza',
    'SUPERADMIN',
    'ACTIVE'
FROM auth.users
WHERE email = 'jcesperanza@neu.edu.ph';


-- Link User to all 4 Modules
INSERT INTO user_module (user_id, module_id, rights_value)
SELECT u.user_id, m.module_id, 1
FROM "user" u
JOIN Module m ON true
WHERE u.email = 'jcesperanza@neu.edu.ph';

-- Grant all 9 Rights to the Superadmin (value = 1)
INSERT INTO UserModule_Rights (user_id, module_id, right_id, is_allowed)
SELECT
    um.user_id,
    um.module_id,
    r.right_id,
    1
FROM user_module um
JOIN rights r ON r.module_id = um.module_id
JOIN "user" u ON u.user_id = um.user_id
WHERE u.email = 'jcesperanza@neu.edu.ph';
