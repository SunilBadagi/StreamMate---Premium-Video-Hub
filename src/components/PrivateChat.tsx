import React, { useState, useEffect } from "react";
import { Clipboard, Send, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { encryptMessage, decryptMessage } from "../lib/encryption";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

// Define Room & Message Types
interface Room {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  encrypted_content: string;
  decrypted_content: string;
  created_at: string;
}

export default function PrivateChat() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [showNewRoomDialog, setShowNewRoomDialog] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>(""); // For joining rooms
  const { user } = useAuthStore();

  // 🔹 Load Rooms for the Authenticated User
  const loadRooms = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching room IDs:", error);
      toast.error("Failed to load rooms");
      return;
    }

    if (!data || data.length === 0) {
      setRooms([]);
      return;
    }

    const roomIds = data.map((r) => r.room_id);

    const { data: rooms, error: roomError } = await supabase
      .from("private_rooms")
      .select("*")
      .in("id", roomIds);

    if (roomError) {
      console.error("Error fetching room details:", roomError);
      toast.error("Failed to load rooms");
    } else {
      setRooms(rooms as Room[]);
    }
  };

  // 🔹 Load Messages for the Selected Room
  const loadMessages = async () => {
    if (!selectedRoom) return;

    const { data, error } = await supabase
      .from("encrypted_messages")
      .select("*")
      .eq("room_id", selectedRoom.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } else {
      setMessages(
        (data as Message[]).map((msg) => ({
          ...msg,
          decrypted_content: decryptMessage(msg.encrypted_content),
        }))
      );
    }
  };

  // 🔹 Create a New Room and Add User to Room Members
  const createRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    if (!user?.id) {
      toast.error("User is not authenticated");
      return;
    }

    try {
      const inviteCode = Math.random().toString(36).substr(2, 8);

      const { data: roomData, error: roomError } = await supabase
        .from("private_rooms")
        .insert([{ name: newRoomName, created_by: user.id, invite_code: inviteCode }])
        .select()
        .single();

      if (roomError) throw roomError;

      await supabase.from("room_members").insert([{ room_id: roomData.id, user_id: user.id }]);

      toast.success(`Room created! Share this invite code: ${inviteCode}`);
      setNewRoomName("");
      setShowNewRoomDialog(false);
      loadRooms();
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error(error.message);
    }
  };

  // 🔹 Send a Message to the Selected Room
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const encrypted = encryptMessage(newMessage);

      const tempMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        room_id: selectedRoom.id,
        sender_id: user.id,
        encrypted_content: encrypted,
        decrypted_content: newMessage,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);

      await supabase.from("encrypted_messages").insert([
        {
          room_id: selectedRoom.id,
          sender_id: user.id,
          encrypted_content: encrypted,
        },
      ]);

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // 🔹 Join a Room with Invite Code
  const joinRoom = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter a valid invite code");
      return;
    }

    if (!user?.id) {
      toast.error("User is not authenticated");
      return;
    }

    try {
      const { data: room, error } = await supabase
        .from("private_rooms")
        .select("id")
        .eq("invite_code", inviteCode)
        .single();

      if (error || !room) {
        toast.error("Invalid invite code");
        return;
      }

      const { data: existingMember } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        toast.error("You are already in this room!");
        return;
      }

      await supabase.from("room_members").insert([{ room_id: room.id, user_id: user.id }]);

      toast.success("Joined the room successfully!");
      loadRooms();
      setInviteCode(""); 
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Failed to join room");
    }
  };

  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages();
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      const subscription = supabase
        .channel(`room_${selectedRoom.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "encrypted_messages",
            filter: `room_id=eq.${selectedRoom.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message; // Ensure TypeScript knows the expected structure
  
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                ...newMessage,
                decrypted_content: decryptMessage(newMessage.encrypted_content), // Decrypt the message
              } as Message, // Ensure full type compatibility
            ]);
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedRoom]);
  

  return (
    <div className="flex h-[calc(100vh-6rem)]">


      {/* Rooms Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 p-4 border-r dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rooms</h2>
          <button onClick={() => setShowNewRoomDialog(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <Plus size={20} />
          </button>
        </div>

        {/* Join Room by Code */}
        <div className="mb-4">
          <input type="text" placeholder="Enter invite code..." value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="p-2 border rounded-lg w-full dark:bg-gray-700 dark:border-gray-600" />
          <button onClick={joinRoom} className="mt-2 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
            Join Room
          </button>
        </div>

        {/* Room List */}
        <div className="space-y-2">
          {rooms.map((room) => (
            <button key={room.id} onClick={() => setSelectedRoom(room)} className={`w-full text-left p-2 rounded ${selectedRoom?.id === room.id ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
              {room.name}
            </button>
          ))}
        </div>
      </div>

       {/* New Room Dialog */}
      {showNewRoomDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Room</h3>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter room name"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewRoomDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">{selectedRoom.name}</h3>

              {/* Copy Invite Code Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedRoom.invite_code);
                  toast.success("Invite code copied!");
                }}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
              >
                <Clipboard size={20} className="mr-2" /> Copy Invite Code
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      message.sender_id === user.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    {message.decrypted_content}
                  </div>
                </div>
              ))}
            </div>

            {/* Send Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-2 rounded-lg border dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a room to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
