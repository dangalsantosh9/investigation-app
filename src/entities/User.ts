import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ nullable: true })
  fullName!: string;

  @Column({ default: 'member' })
  role!: string;

  @Column({ default: 0 })
  profileViews!: number;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }
}
