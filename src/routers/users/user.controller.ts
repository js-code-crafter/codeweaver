import { Validate, ZodInput } from "ts-zod-decorators";
import { CreateUserDto, CreateUser } from "./dto/user.dto";
import { onError, rateLimit, throttle } from "utils-decorators";

function exceedHandler() {
  throw new Error("Too much call in allowed window");
}

function errorHandler(e: Error): void {
  console.error(e);
}

export default class UserController {
  //constructor(private readonly userService: UserService) { }

  // Throttle the createUser method to 1 request per 200 milliseconds
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  @onError({
    func: errorHandler,
  })
  @Validate
  public async createUser(
    @ZodInput(CreateUserDto) data: CreateUser
  ): Promise<string> {
    // Here you can include logic to save user to database
    console.log("Creating user:", data);
    return "User created successfully";
  }
}
