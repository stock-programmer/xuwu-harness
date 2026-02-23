import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface ProjectAttributes {
  id: string;
  name: string;
  type: 'fullstack' | 'frontend' | 'backend';
  status: string;
  current_mode: string | null;
  root_path: string;
  created_at: Date;
  updated_at: Date;
}

interface ProjectCreationAttributes
  extends Optional<
    ProjectAttributes,
    'id' | 'current_mode' | 'created_at' | 'updated_at'
  > {}

export class Project
  extends Model<ProjectAttributes, ProjectCreationAttributes>
  implements ProjectAttributes
{
  public id!: string;
  public name!: string;
  public type!: 'fullstack' | 'frontend' | 'backend';
  public status!: string;
  public current_mode!: string | null;
  public root_path!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    current_mode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    root_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
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
    tableName: 'projects',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        name: 'idx_projects_status',
        fields: ['status'],
      },
      {
        name: 'idx_projects_type',
        fields: ['type'],
      },
    ],
  }
);
