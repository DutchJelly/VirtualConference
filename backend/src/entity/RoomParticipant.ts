import {Entity, BaseEntity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne, JoinColumn} from "typeorm"
import { Call } from "./Call";
import { Room } from "./Room";
import { User } from "./User";


@Entity()
export class RoomParticipant extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Room, (r) => r.members)
    room!: Room;

    @ManyToOne(() => Call, call => call.members, {nullable: true})
    call: Call | null | undefined;

    @OneToOne(() => User, {nullable: false})
    @JoinColumn()
    user!: User;

    allRoomParticipants() {
        return {
			room: this.room,
            user: this.user,
            call: this.call
        }
	}
}
