import {Entity, BaseEntity, OneToOne, JoinColumn, PrimaryGeneratedColumn, OneToMany, Column} from "typeorm"
import { Room } from "./Room";
import { RoomParticipant } from "./RoomParticipant";


//In the calls database user that are in a call will be stored here together with the Rooms unique identifier.
@Entity()
export class Call extends BaseEntity {

	@PrimaryGeneratedColumn()
	callId!: number;

	@Column()
	url!: string;

	@Column({default: 'open'})
	type!: string;

	@OneToOne(() => Room)
	@JoinColumn()
    room!: Room;

	@OneToMany(() => RoomParticipant, (participant) => participant.call)
	members!: RoomParticipant[];
	
    allCalls() {
        return {
			id: this.callId,
			url: this.url,
			room: this.room,
			members: this.members
        }
	}
}
