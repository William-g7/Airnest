interface PlaceTypeProps {
    title: string;
    description: string;
    value: string;
    icon: string;
}

export const placeTypeOptions: PlaceTypeProps[] = [
    {
        title: 'An entire place',
        description: 'Guests have the whole place to themselves.',
        value: 'entire',
        icon: '/placetypes/room.svg'
    },
    {
        title: 'A room',
        description: 'Guests have their own room in a home, plus access to shared spaces.',
        value: 'room',
        icon: '/placetypes/door.svg'
    },
    {
        title: 'A shared room in a hostel',
        description: 'Guests sleep in a shared room in a managed hostel with staff on-site 24/7.',
        value: 'shared',
        icon: '/placetypes/hostel.svg'
    }
];