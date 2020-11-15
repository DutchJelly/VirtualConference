import {Entity, BaseEntity, Column, PrimaryColumn, BeforeInsert, PrimaryGeneratedColumn} from "typeorm"
import { genSaltSync, hashSync} from "bcrypt"
import {IsEmail, Length, } from "class-validator"

@Entity()
export class Rooms extends BaseEntity {

	@PrimaryGeneratedColumn()
    roomID!: number;

    @Column()
	roomCode!: string;

    allRooms() {
        return {
			roomID: this.roomID,
			roomCode: this.roomCode
        }
	}	
}
