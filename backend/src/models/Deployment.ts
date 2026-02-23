import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface DeploymentAttributes {
  id: string;
  project_id: string;
  version: string;
  platform: string;
  environment: string;
  status: string;
  deployment_url: string | null;
  git_commit_sha: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  created_at: Date;
}

interface DeploymentCreationAttributes
  extends Optional<
    DeploymentAttributes,
    | 'id'
    | 'deployment_url'
    | 'git_commit_sha'
    | 'started_at'
    | 'completed_at'
    | 'error_message'
    | 'created_at'
  > {}

export class Deployment
  extends Model<DeploymentAttributes, DeploymentCreationAttributes>
  implements DeploymentAttributes
{
  public id!: string;
  public project_id!: string;
  public version!: string;
  public platform!: string;
  public environment!: string;
  public status!: string;
  public deployment_url!: string | null;
  public git_commit_sha!: string | null;
  public started_at!: Date | null;
  public completed_at!: Date | null;
  public error_message!: string | null;
  public readonly created_at!: Date;
}

Deployment.init(
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
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    environment: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    deployment_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    git_commit_sha: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'deployments',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        name: 'idx_deployments_project',
        fields: ['project_id'],
      },
      {
        name: 'idx_deployments_status',
        fields: ['status'],
      },
    ],
  }
);
