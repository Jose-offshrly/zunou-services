@extends('layouts.mail')

@section('content')
    <p>
        Hi {{ $userName }},
    </p>

    @if($userRole==='User')
    <p>
        You have been invited to join {{ $organizationName }} on Zunou as a {{$userRole}}.
    </p>
    <p>
        Join the team to start collaborating and accessing shared resources
    </p>
    @endif

    @if($userRole==='Owner')
        <p>
            You have been invited to become an {{$userRole}} of {{ $organizationName }} on Zunou.
        </p>
        <p>
            As an {{$userRole}}, you'll have full access to manage the organization,members, and settings.
        </p>
    @endif

    <p>
       Click below to go to your organization
    </p>

    <p>
        <a class="button" href="{{ $appUrl }}">Go to {{$organizationName}}</a>
    </p>
    <p>
        Looking forward to having you on board,
    </p>
    <p>
        The Zunou Team
    </p>
@endsection
