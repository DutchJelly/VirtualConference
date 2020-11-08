import {Entity, BaseEntity, Column, PrimaryColumn, BeforeInsert} from "typeorm"
import { genSaltSync, hashSync} from "bcrypt"
import {IsBoolean, IsEmail, Length } from "class-validator"

//User entity. People that will visit the conference will have to create an account. That will be stored here.
@Entity()
export class User extends BaseEntity {

    @BeforeInsert()
    private hashPassword() {
        this.password = hashSync(this.password, genSaltSync())
	}
	


    @PrimaryColumn()
    @IsEmail()
    username!: string;

    @Column()
    @Length(8)
	password!: string;
	
	@Column({default: ""})
	sessionKey!: string ;

	@Column({default: false})
	@IsBoolean()
	loginStatus!: boolean;
	
	@Column()
	profilePicture!: string; //TODO: Currently using string, should be changed later, but we didn't know how to fix it.

    toUserData() {
        return {
			username: this.username,
			loginStatus: this.loginStatus
        }
	}	
}
