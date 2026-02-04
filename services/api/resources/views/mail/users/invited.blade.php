@extends('layouts.mail')

@section('content')
  <p>
    Hi {{ $userName }},
  </p>

  <p>
    You have been invited to join {{ $organizationName }}'s Zunou.ai organization.
  </p>

  @if(!$existing)
  <p>
    Your invite code is
    <a href="{{ $inviteUrl }}">{{ $inviteCode }}</a>. Click the button below to accept this invitation:
  </p>
  
  <p>
    <a class="button" href="{{ $inviteUrl }}">Accept Invitation</a>
  </p>
  @else
  <p>
    <a class="button" href="{{ $appUrl }}">Go to Zunou</a>
  </p>
  @endif

  <p>
    Thanks,
    The Zunou.ai Team
  </p>
@endsection
