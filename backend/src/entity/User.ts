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
	
	//Commented out profile image because we're using a nonnull constraint for it, meaning that it needs to be filled in.
	// @Column()
	// profilePicture!: string;

    toUserData() {
        return {
			username: this.username,
			loginStatus: this.loginStatus
        }
	}	
}
