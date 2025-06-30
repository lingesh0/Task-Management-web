#!/usr/bin/env python3
"""
Database migration script to add email column to user_profiles table.
Run this script to update existing databases.
"""

import os
from sqlalchemy import create_engine, text
from database import engine

def migrate_add_email_column():
    """Add email column to user_profiles table if it doesn't exist"""
    try:
        with engine.connect() as conn:
            # Check if email column already exists (PostgreSQL syntax)
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user_profiles' AND column_name = 'email'
            """))
            columns = [row[0] for row in result.fetchall()]
            
            if 'email' not in columns:
                print("Adding email column to user_profiles table...")
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN email TEXT"))
                conn.commit()
                print("✅ Email column added successfully!")
            else:
                print("✅ Email column already exists in user_profiles table.")
                
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting database migration...")
    success = migrate_add_email_column()
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!") 