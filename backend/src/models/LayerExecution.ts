import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface LayerExecutionAttributes {
  id: string;
  project_id: string;
  layer_num: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  status: string;
  started_at: Date | null;
  completed_at: Date | null;
  duration_ms: number | null;
  created_at: Date;
  updated_at: Date;
}

interface LayerExecutionCreationAttributes
  extends Optional<
    LayerExecutionAttributes,
    | 'id'
    | 'completed_tasks'
    | 'failed_tasks'
    | 'started_at'
    | 'completed_at'
    | 'duration_ms'
    | 'created_at'
    | 'updated_at'
  > {}

export class LayerExecution
  extends Model<LayerExecutionAttributes, LayerExecutionCreationAttributes>
  implements LayerExecutionAttributes
{
  public id!: string;
  public project_id!: string;
  public layer_num!: number;
  public total_tasks!: number;
  public completed_tasks!: number;
  public failed_tasks!: number;
  public status!: string;
  public started_at!: Date | null;
  public completed_at!: Date | null;
  public duration_ms!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LayerExecution.init(
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
    layer_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_tasks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed_tasks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    failed_tasks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    tableName: 'layer_executions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        name: 'idx_layer_executions_project',
        fields: ['project_id'],
      },
      {
        name: 'idx_layer_executions_layer',
        fields: ['layer_num'],
      },
    ],
  }
);
