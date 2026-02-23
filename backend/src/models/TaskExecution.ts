import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface TaskExecutionAttributes {
  id: string;
  project_id: string;
  task_id: string;
  layer_num: number;
  task_file: string;
  task_name: string;
  status: string;
  started_at: Date | null;
  completed_at: Date | null;
  duration_ms: number | null;
  claude_prompt: string | null;
  claude_output: string | null;
  validation_result: object | null;
  error_message: string | null;
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

interface TaskExecutionCreationAttributes
  extends Optional<
    TaskExecutionAttributes,
    | 'id'
    | 'started_at'
    | 'completed_at'
    | 'duration_ms'
    | 'claude_prompt'
    | 'claude_output'
    | 'validation_result'
    | 'error_message'
    | 'retry_count'
    | 'created_at'
    | 'updated_at'
  > {}

export class TaskExecution
  extends Model<TaskExecutionAttributes, TaskExecutionCreationAttributes>
  implements TaskExecutionAttributes
{
  public id!: string;
  public project_id!: string;
  public task_id!: string;
  public layer_num!: number;
  public task_file!: string;
  public task_name!: string;
  public status!: string;
  public started_at!: Date | null;
  public completed_at!: Date | null;
  public duration_ms!: number | null;
  public claude_prompt!: string | null;
  public claude_output!: string | null;
  public validation_result!: object | null;
  public error_message!: string | null;
  public retry_count!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TaskExecution.init(
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
    task_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    layer_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    task_file: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    task_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    claude_prompt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    claude_output: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    validation_result: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'task_executions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        name: 'idx_task_executions_project',
        fields: ['project_id'],
      },
      {
        name: 'idx_task_executions_status',
        fields: ['status'],
      },
      {
        name: 'idx_task_executions_layer',
        fields: ['layer_num'],
      },
    ],
  }
);
