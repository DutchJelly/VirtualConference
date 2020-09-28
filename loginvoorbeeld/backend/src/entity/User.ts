import {Entity, BaseEntity, Column, PrimaryColumn, OneToMany, ManyToOne, PrimaryGeneratedColumn, ManyToMany} from "typeorm"

@Entity()
export class User extends BaseEntity {

    @PrimaryColumn()
    username!: string;

    @Column()
    password!: string;

    @Column()
    @OneToMany((type) => Message, (message) => message.sender)
    messages!: Message[]
}

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    contents!: string;

    @Column()
    @ManyToOne((type) => User, (user) => user.messages)
    sender!: User;
}