import {Entity, BaseEntity, Column, PrimaryColumn, BeforeInsert} from "typeorm"
import { genSaltSync, hashSync} from "bcrypt"
import {isEmail, IsEmail, Length,  } from "class-validator"

@Entity()
export class Calls extends BaseEntity {

	@PrimaryColumn()
    roomID!: number;

	@PrimaryColumn()
    @IsEmail()
    username!: string;
	
    allCalls() {
        return {
			roomID: this.roomID,
			username: this.username
        }
	}	
}
