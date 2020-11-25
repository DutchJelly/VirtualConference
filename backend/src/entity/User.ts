import {Entity, BaseEntity, Column, BeforeInsert, PrimaryGeneratedColumn} from "typeorm"
import { genSaltSync, hashSync} from "bcrypt"
import { IsEmail, Length } from "class-validator"

//TODO make typeorm update this automatically
export const sessionExpireDuration = 10 * 60 * 60 * 1000; //10 hours

//User entity. People that will visit the conference will have to create an account. That will be stored here.
@Entity()
export class User extends BaseEntity {

    @BeforeInsert()
    private hashPassword() {
        this.password = hashSync(this.password, genSaltSync())
	}

	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
    @IsEmail()
    email!: string;

    @Column()
    @Length(8)
	password!: string;

	@Column()
	username!: string;

	@Column()
	image!: string;

	@Column({default: ""})
	sessionKey!: string;

	@Column({default: 0})
	expireDate!: number;
	
    toUserData() {
        return {
			username: this.email,
			image: this.image,
			sessionKey: this.sessionKey,
			email: this.email,
			id: this.id
        }
	}
}
