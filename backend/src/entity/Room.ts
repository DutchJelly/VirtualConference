import {Entity, BaseEntity, Column, PrimaryColumn, OneToMany} from "typeorm"
import { RoomParticipant } from "./RoomParticipant";

@Entity()
export class Room extends BaseEntity {

	@PrimaryColumn()
    roomId!: string;
    
    //This'll become relevant when a Conference table is added.
    @Column({default: "notImplemented"})
    conferenceId!: string;
    
    //This can be replaced with permissions in the future.
    @Column({default: "open"})
    roomType!: string;
    
    @OneToMany(() => RoomParticipant, participant => participant.room)
    members!: RoomParticipant[];

    allRooms() {
        return {
            id: this.roomId,
            conferenceId: this.conferenceId,
            roomType: this.roomType,
			members: this.members
        }
	}
}
