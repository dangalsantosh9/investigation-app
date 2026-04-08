import { BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { User } from './User.js';

@Entity()
export class Case {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: 'open' })
  status!: string;

  @Column({ default: 'medium' })
  priority!: string;

  @Column({ nullable: true })
  dueDate!: Date;

  @Column({ nullable: true })
  closedAt!: Date;

  @Column()
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: false })
  createdBy!: Relation<User>;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
    this.createdAt = new Date();
  }
}
