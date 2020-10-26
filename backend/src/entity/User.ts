import {Entity, BaseEntity, Column, PrimaryColumn, BeforeInsert} from "typeorm"
import { genSaltSync, hashSync} from "bcrypt"
import {IsBoolean, IsEmail, Length } from "class-validator"

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

    toUserData() {
        return {
			username: this.username,
			loginStatus: this.loginStatus
        }
	}	
}
