import { BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Task } from './Task.js';
import { User } from './User.js';
@Entity()
export class Evidence {
  @PrimaryColumn('uuid') id!: string;
  @Column({ default: 'note' }) type!: string;
  @Column({ nullable: true }) filePath!: string;
  @Column({ nullable: true }) note!: string;
  @Column() uploadedAt!: Date;
  @ManyToOne(() => Task, { nullable: false }) task!: Relation<Task>;
  @ManyToOne(() => User, { nullable: false }) uploadedBy!: Relation<User>;
  @BeforeInsert() generateId() {
    this.id = uuidv7();
    this.uploadedAt = new Date();
  }
}
