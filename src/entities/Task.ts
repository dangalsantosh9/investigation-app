import { BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Case } from './Case.js';
import { User } from './User.js';

@Entity()
export class Task {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ nullable: true })
  dueDate!: Date;

  @Column({ nullable: true })
  completedAt!: Date;

  @Column()
  createdAt!: Date;

  @Column({ nullable: true })
  updatedAt!: Date;

  @ManyToOne(() => Case, { nullable: false })
  caseEntity!: Relation<Case>;

  @ManyToOne(() => User, { nullable: false })
  createdBy!: Relation<User>;

  @ManyToOne(() => User, { nullable: true })
  assignedTo!: Relation<User>;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
    this.createdAt = new Date();
  }
}
