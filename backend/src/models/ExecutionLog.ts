import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface ExecutionLogAttributes {
  id: string;
  project_id: string;
  task_execution_id: string | null;
  level: string;
  message: string;
  metadata: object | null;
  created_at: Date;
}

interface ExecutionLogCreationAttributes
  extends Optional<
    ExecutionLogAttributes,
    'id' | 'task_execution_id' | 'metadata' | 'created_at'
  > {}

export class ExecutionLog
  extends Model<ExecutionLogAttributes, ExecutionLogCreationAttributes>
  implements ExecutionLogAttributes
{
  public id!: string;
  public project_id!: string;
  public task_execution_id!: string | null;
  public level!: string;
  public message!: string;
  public metadata!: object | null;
  public readonly created_at!: Date;
}

ExecutionLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    task_execution_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'task_executions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    level: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'execution_logs',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        name: 'idx_execution_logs_project',
        fields: ['project_id'],
      },
      {
        name: 'idx_execution_logs_task',
        fields: ['task_execution_id'],
      },
      {
        name: 'idx_execution_logs_level',
        fields: ['level'],
      },
      {
        name: 'idx_execution_logs_created',
        fields: ['created_at'],
      },
    ],
  }
);
