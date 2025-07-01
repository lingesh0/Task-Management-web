"""
Add subtasks column to tasks table
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = '64721e6575d6'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('tasks', sa.Column('subtasks', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('tasks', 'subtasks') 