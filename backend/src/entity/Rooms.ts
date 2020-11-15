import {Entity, BaseEntity, Column, PrimaryColumn, BeforeInsert, PrimaryGeneratedColumn} from "typeorm"
import { genSaltSync, hashSync} from "bcrypt"
import {IsEmail, Length, } from "class-validator"


//User who start a call will be put in a jitsi room (or possibly another application). 
//Here the roomID is the unique identifier and the roomCode is the online code to join the room.
@Entity()
export class Rooms extends BaseEntity {

	@PrimaryGeneratedColumn()
    roomID!: number;

    @Column()
    roomCode!: string;
    
    @Column()
	roomType!: string;

	@Column()
	roomType!: string;

    allRooms() {
        return {
			roomID: this.roomID,
			roomCode: this.roomCode,
			roomType: this.roomType

        }
	}	
}
