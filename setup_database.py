#!/usr/bin/env python3
"""
PostgreSQL Database Setup Script for GIS Gate
Creates the complete database schema from Prisma schema
"""

import psycopg2
from psycopg2 import sql
import re
import os
from typing import Dict, List, Tuple

# Database configuration
DB_CONFIG = {
    'host': '204.12.205.110',
    'port': 5432,
    'user': 'postgres',
    'password': 'dkj87232!$JF*#JVNa#$#*432kv',
    'database': 'gisgate'
}

def parse_prisma_schema(schema_path: str) -> Dict:
    """Parse Prisma schema file and extract models, enums, and relationships"""
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract enums
    enums = {}
    enum_pattern = r'enum\s+(\w+)\s*\{([^}]+)\}'
    for match in re.finditer(enum_pattern, content, re.MULTILINE | re.DOTALL):
        enum_name = match.group(1)
        enum_content = match.group(2)
        
        # Parse enum values, removing comments
        values = []
        for line in enum_content.split('\n'):
            line = line.strip()
            if line and not line.startswith('//'):
                # Remove inline comments
                value = line.split('//')[0].strip()
                if value:
                    values.append(value)
        
        enums[enum_name] = values

    # Extract models
    models = {}
    model_pattern = r'model\s+(\w+)\s*\{([^}]+)\}'
    for match in re.finditer(model_pattern, content, re.MULTILINE | re.DOTALL):
        model_name = match.group(1)
        model_content = match.group(2)

        fields = []
        table_name = None

        for line in model_content.split('\n'):
            line = line.strip()
            if not line or line.startswith('//'):
                continue

            # Check for table mapping
            if line.startswith('@@map('):
                table_match = re.search(r'@@map\("([^"]+)"\)', line)
                if table_match:
                    table_name = table_match.group(1)
                continue

            # Parse field
            if ' ' in line:
                field_parts = line.split()
                if len(field_parts) >= 2:
                    field_name = field_parts[0]
                    field_type = field_parts[1]

                    # Skip compound unique constraints
                    if field_name.startswith('@@'):
                        continue

                    # Handle optional fields (type ends with ?)
                    is_optional = field_type.endswith('?')
                    if is_optional:
                        field_type = field_type[:-1]

                    # Handle relations
                    is_relation = '@relation(' in line

                    # Skip array types for now (relations)
                    if field_type.endswith('[]') and not field_type[:-2] in ['String', 'Int', 'Float', 'Boolean']:
                        continue

                    fields.append({
                        'name': field_name,
                        'type': field_type,
                        'optional': is_optional,
                        'relation': is_relation,
                        'raw': line
                    })

        models[model_name] = {
            'table_name': table_name or model_name.lower(),
            'fields': fields
        }

    return {'models': models, 'enums': enums}

def generate_sql_type(prisma_type: str) -> str:
    """Convert Prisma type to PostgreSQL type"""
    type_mapping = {
        'String': 'TEXT',
        'Int': 'INTEGER',
        'Float': 'REAL',
        'Boolean': 'BOOLEAN',
        'DateTime': 'TIMESTAMP WITH TIME ZONE',
        'Json': 'JSONB',
        'BigInt': 'BIGINT',
        'Decimal': 'DECIMAL',
        'UUID': 'UUID'
    }

    # Handle enums - keep original case
    if prisma_type in ['ArticleStatus', 'UserRole', 'CourseLevel', 'PaymentStatus', 'RefundStatus', 'SolutionType']:
        return prisma_type

    # Handle arrays - for now, skip or handle differently
    if prisma_type.endswith('[]'):
        base_type = prisma_type[:-2]
        if base_type in type_mapping:
            return f'{type_mapping[base_type]}[]'
        return 'TEXT'  # Default for unknown array types

    return type_mapping.get(prisma_type, 'TEXT')

def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to postgres database first
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_CONFIG['database'],))
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(sql.SQL("CREATE DATABASE {} WITH OWNER = {} ENCODING = 'UTF8'")
                         .format(sql.Identifier(DB_CONFIG['database']), sql.Identifier(DB_CONFIG['user'])))
            print(f"✅ Database '{DB_CONFIG['database']}' created successfully")
        else:
            print(f"ℹ️  Database '{DB_CONFIG['database']}' already exists")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error creating database: {e}")
        raise

def create_enums(cursor, enums: Dict):
    """Create enum types"""
    for enum_name, values in enums.items():
        try:
            # Drop enum if exists
            cursor.execute(f'DROP TYPE IF EXISTS "{enum_name}" CASCADE')

            # Create enum
            enum_values = [f"'{v.strip()}'" for v in values if v.strip()]
            create_enum_stmt = f'CREATE TYPE "{enum_name}" AS ENUM ({", ".join(enum_values)})'
            print(f"DEBUG: Creating enum: {create_enum_stmt}")
            cursor.execute(create_enum_stmt)
            cursor.connection.commit()
            print(f"✅ Created enum {enum_name}")
        except Exception as e:
            print(f"❌ Error creating enum {enum_name}: {e}")
            cursor.connection.rollback()

def create_tables(cursor, models: Dict):
    """Create all tables"""
    # First pass: Create tables without foreign keys
    for model_name, model_info in models.items():
        table_name = model_info['table_name']

        try:
            # Drop table if exists
            cursor.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE')

            # Build CREATE TABLE statement
            columns = []

            for field in model_info['fields']:
                if field['relation']:
                    continue  # Skip relations for now

                col_name = field['name']
                col_type = generate_sql_type(field['type'])

                # Handle special cases
                if col_name == 'id' and col_type == 'UUID':
                    columns.append(f'"{col_name}" {col_type} PRIMARY KEY DEFAULT gen_random_uuid()')
                elif col_name == 'id' and col_type == 'TEXT':
                    columns.append(f'"{col_name}" {col_type} PRIMARY KEY DEFAULT gen_random_uuid()')
                elif col_name == 'createdAt':
                    columns.append(f'"{col_name}" {col_type} DEFAULT NOW()')
                elif col_name == 'updatedAt':
                    columns.append(f'"{col_name}" {col_type} DEFAULT NOW()')
                else:
                    nullable = '' if field['optional'] else 'NOT NULL'
                    # Quote enum types
                    if col_type in ['ArticleStatus', 'UserRole', 'CourseLevel', 'PaymentStatus', 'RefundStatus', 'SolutionType']:
                        col_type = f'"{col_type}"'
                    columns.append(f'"{col_name}" {col_type} {nullable}'.strip())

            if columns:
                create_stmt = f'CREATE TABLE "{table_name}" ({", ".join(columns)})'
                print(f"DEBUG: Executing: {create_stmt}")
                cursor.execute(create_stmt)
                cursor.connection.commit()  # Commit immediately after successful table creation
                print(f"✅ Created table {table_name}")

        except Exception as e:
            print(f"❌ Error creating table {table_name}: {e}")
            cursor.connection.rollback()  # Rollback on error

def add_indexes_and_constraints(cursor, models: Dict):
    """Add indexes, unique constraints, and foreign keys"""
    for model_name, model_info in models.items():
        table_name = model_info['table_name']

        for field in model_info['fields']:
            if field['relation']:
                continue

            field_name = field['name']
            raw_field = field['raw']

            try:
                # Check for unique constraints
                if '@unique' in raw_field:
                    constraint_name = f"{table_name}_{field_name}_unique"
                    cursor.execute(f'ALTER TABLE "{table_name}" ADD CONSTRAINT "{constraint_name}" UNIQUE ("{field_name}")')
                    print(f"✅ Added unique constraint on {table_name}.{field_name}")
                    cursor.connection.commit()  # Commit immediately

                # Check for indexes (fields with @db.Index or just unique fields)
                if '@unique' in raw_field or field_name in ['email', 'username', 'slug']:
                    index_name = f"{table_name}_{field_name}_idx"
                    cursor.execute(f'CREATE INDEX "{index_name}" ON "{table_name}" ("{field_name}")')
                    print(f"✅ Created index on {table_name}.{field_name}")
                    cursor.connection.commit()  # Commit immediately

            except Exception as e:
                print(f"⚠️  Warning adding constraint/index on {table_name}.{field_name}: {e}")
                cursor.connection.rollback()  # Rollback on error

def main():
    """Main setup function"""
    print("🚀 Setting up PostgreSQL database for GIS Gate...")
    print(f"📍 Server: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"📊 Database: {DB_CONFIG['database']}")
    print()

    # Path to Prisma schema
    schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')

    if not os.path.exists(schema_path):
        print(f"❌ Prisma schema not found at: {schema_path}")
        return

    # Parse schema
    print("📋 Parsing Prisma schema...")
    schema_data = parse_prisma_schema(schema_path)
    print(f"📊 Found {len(schema_data['models'])} models and {len(schema_data['enums'])} enums")
    print()

    try:
        # Create database
        create_database()

        # Connect to the target database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Enable UUID extension
        cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
        print("✅ Enabled UUID extension")

        # Create enums
        print("\n🔧 Creating enums...")
        create_enums(cursor, schema_data['enums'])
        conn.commit()  # Commit after enums

        # Create tables
        print("\n📦 Creating tables...")
        create_tables(cursor, schema_data['models'])
        conn.commit()  # Commit after tables

        # Add indexes and constraints
        print("\n🔗 Adding indexes and constraints...")
        add_indexes_and_constraints(cursor, schema_data['models'])
        conn.commit()  # Commit after constraints

        print("\n🎉 Database setup completed successfully!")
        print(f"📍 Database ready at: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")

    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()