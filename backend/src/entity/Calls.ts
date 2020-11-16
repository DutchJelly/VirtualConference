import {Entity, BaseEntity, Column, PrimaryColumn, BeforeInsert, OneToOne, JoinColumn, PrimaryGeneratedColumn} from "typeorm"
import { genSaltSync, hashSync} from "bcrypt"
import {isEmail, IsEmail, Length,  } from "class-validator"
import { Rooms } from "./Rooms";
import { User } from "./User";


//In the calls database user that are in a call will be stored here together with the Rooms unique identifier.
@Entity()
export class Calls extends BaseEntity {

	@PrimaryGeneratedColumn()
	callId!: number;

	@OneToOne(() => Rooms)
	@JoinColumn()
    roomID!: number;

	// @PrimaryColumn() //linken naar user met foreign key met one-to-one relatie
	@IsEmail()
	@OneToOne(() => User)
	@JoinColumn()
	username!: string;
	
    allCalls() {
        return {
			roomID: this.roomID,
			username: this.username
        }
	}	
}
