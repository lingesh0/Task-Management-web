"""
Add completed_at column to tasks table
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '64721e6575d6'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('tasks', sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True))

def downgrade():
    op.drop_column('tasks', 'completed_at') 