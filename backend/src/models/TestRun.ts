import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface TestRunAttributes {
  id: string;
  project_id: string;
  iteration: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  test_results: object;
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number | null;
  created_at: Date;
}

interface TestRunCreationAttributes
  extends Optional<
    TestRunAttributes,
    'id' | 'completed_at' | 'duration_ms' | 'created_at'
  > {}

export class TestRun
  extends Model<TestRunAttributes, TestRunCreationAttributes>
  implements TestRunAttributes
{
  public id!: string;
  public project_id!: string;
  public iteration!: number;
  public total_tests!: number;
  public passed_tests!: number;
  public failed_tests!: number;
  public test_results!: object;
  public started_at!: Date;
  public completed_at!: Date | null;
  public duration_ms!: number | null;
  public readonly created_at!: Date;
}

TestRun.init(
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
    iteration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_tests: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    passed_tests: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    failed_tests: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    test_results: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: 'test_runs',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        name: 'idx_test_runs_project',
        fields: ['project_id'],
      },
    ],
  }
);
