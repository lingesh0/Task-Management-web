"""
Add tags column to tasks table
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('tasks', sa.Column('tags', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('tasks', 'tags') 