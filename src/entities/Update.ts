import { BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Task } from './Task.js';
import { User } from './User.js';

@Entity()
export class TaskUpdate {
  @PrimaryColumn('uuid') id!: string;

  @Column() message!: string;

  @Column() createdAt!: Date;

  @Column({ nullable: true }) editedAt!: Date;

  @ManyToOne(() => Task, { nullable: false }) task!: Relation<Task>;

  @ManyToOne(() => User, { nullable: false }) createdBy!: Relation<User>;

  @BeforeInsert() generateid() {
    this.id = uuidv7();
    this.createdAt = new Date();
  }
}
